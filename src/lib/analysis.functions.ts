import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  profile: z.object({
    name: z.string().max(200),
    headline: z.string().max(500),
    about: z.string().max(4000),
    skills: z.string().max(4000),
    projects: z.string().max(6000),
    experience: z.string().max(6000),
  }),
  opportunity: z.object({
    title: z.string().max(300),
    company: z.string().max(300),
    description: z.string().max(4000),
    skills: z.array(z.string().max(200)).max(50),
    responsibilities: z.array(z.string().max(500)).max(50),
  }),
});

export const ResultSchema = z.object({
  relevantSkills: z.array(
    z.object({ item: z.string().min(1), evidence: z.string().min(1), relevance: z.string().min(1) }),
  ),
  potentialGaps: z.array(z.object({ requirement: z.string().min(1), reason: z.string().min(1) })),
  recommendedNextSteps: z.array(z.object({ action: z.string().min(1), reason: z.string().min(1) })),
});
export type FitResult = z.infer<typeof ResultSchema>;

export type FitResponse =
  | { ok: true; result: FitResult }
  | { ok: false; kind: "unavailable" | "invalid" | "error"; message: string };

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["relevantSkills", "potentialGaps", "recommendedNextSteps"],
  properties: {
    relevantSkills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "evidence", "relevance"],
        properties: { item: { type: "string" }, evidence: { type: "string" }, relevance: { type: "string" } },
      },
    },
    potentialGaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "reason"],
        properties: { requirement: { type: "string" }, reason: { type: "string" } },
      },
    },
    recommendedNextSteps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action", "reason"],
        properties: { action: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
};

const INSTRUCTIONS = `You are a career fit analyst for SkillBridge Lite. Compare the supplied professional profile with the supplied opportunity.
Rules:
- Use ONLY information present in the profile and opportunity. Never invent skills, qualifications, projects, or experience.
- relevantSkills: skills/experience from the profile that relate to the opportunity. "evidence" must quote or closely paraphrase where in the profile it appears (skills list, a project, or experience). "relevance" explains how it relates to the opportunity.
- potentialGaps: opportunity requirements not supported by the profile. In "reason", distinguish missing evidence ("the profile does not mention...") from a confirmed lack of skill (only if the profile explicitly states it). Default to missing evidence.
- recommendedNextSteps: concrete, realistic actions to strengthen fit or document existing evidence.
- Never guarantee or predict hiring outcomes.
- Keep each field to one or two concise sentences.`;

export const analyzeFit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<FitResponse> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false, kind: "unavailable", message: "The AI service is not configured for this app." };
    }

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          instructions: INSTRUCTIONS,
          input: [
            {
              role: "user",
              content: `PROFILE:\n${JSON.stringify(data.profile, null, 2)}\n\nOPPORTUNITY:\n${JSON.stringify(data.opportunity, null, 2)}`,
            },
          ],
          reasoning: { effort: "low" },
          store: false,
          stream: true,
          text: { format: { type: "json_schema", name: "fit_analysis", strict: true, schema: jsonSchema } },
        }),
      });
    } catch {
      return { ok: false, kind: "unavailable", message: "Couldn't reach the AI service. Please try again shortly." };
    }

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, body.slice(0, 500));
      if (res.status === 429)
        return { ok: false, kind: "unavailable", message: "The AI service is busy right now. Please wait a moment and try again." };
      if (res.status === 402)
        return { ok: false, kind: "unavailable", message: "AI credits for this app have run out, so analysis is temporarily unavailable." };
      if (res.status === 401 || res.status === 403)
        return { ok: false, kind: "unavailable", message: "The AI service isn't available for this app right now." };
      if (res.status >= 500)
        return { ok: false, kind: "unavailable", message: "The AI service is temporarily unavailable. Please try again later." };
      return { ok: false, kind: "error", message: "The analysis request was rejected. Please try again." };
    }

    // Consume the SSE stream and accumulate output text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let text = "";
    let failed = false;
    let refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
            else if (ev.type === "response.refusal.delta") refused = true;
            else if (ev.type === "response.failed" || ev.type === "error") failed = true;
          } catch {
            /* ignore malformed frame */
          }
        }
      }
    }

    if (refused) return { ok: false, kind: "error", message: "The AI declined to analyze this profile." };
    if (failed || !text) return { ok: false, kind: "error", message: "The analysis didn't complete. Please try again." };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, kind: "invalid", message: "The AI returned a response we couldn't read. Please try again." };
    }
    const check = ResultSchema.safeParse(parsed);
    if (!check.success) {
      return { ok: false, kind: "invalid", message: "The AI returned an incomplete analysis. Please try again." };
    }
    return { ok: true, result: check.data };
  });
