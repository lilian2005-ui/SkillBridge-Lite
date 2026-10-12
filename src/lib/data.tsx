import { createContext, useContext, useState, type ReactNode } from "react";

export type Profile = {
  name: string;
  headline: string;
  about: string;
  skills: string;
  projects: string;
  experience: string;
};

export const SAMPLE_PROFILE: Profile = {
  name: "Alex Sample",
  headline: "Computer Science student (sample profile)",
  about: "This is a sample profile used for demonstration. Replace it with your own details.",
  skills: "Python, HTML, CSS, JavaScript",
  projects: "Weather dashboard using a public API; personal portfolio website",
  experience: "Volunteer tutor for introductory programming (sample)",
};

export type Opportunity = {
  id: string;
  title: string;
  company: string;
  description: string;
  skills: string[];
  responsibilities: string[];
};

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "ai-automation-intern",
    title: "AI Automation Intern",
    company: "TechFlow",
    description:
      "Support development of AI-powered workflows and automation solutions for business processes.",
    skills: ["Python", "AI", "Automation", "APIs"],
    responsibilities: [
      "Help design and test automated workflows",
      "Integrate AI services through APIs",
      "Document processes and results for the team",
    ],
  },
  {
    id: "junior-frontend-developer",
    title: "Junior Frontend Developer",
    company: "PixelWorks",
    description: "Help build responsive web interfaces and interactive user experiences.",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    responsibilities: [
      "Build responsive UI components",
      "Collaborate with designers on user experiences",
      "Fix bugs and improve accessibility",
    ],
  },
  {
    id: "iot-solutions-engineer",
    title: "IoT Solutions Engineer",
    company: "Connected Systems Lab",
    description:
      "Support development of connected systems using sensors, microcontrollers, and software.",
    skills: ["IoT", "Python", "ESP32", "APIs"],
    responsibilities: [
      "Prototype sensor-based devices with microcontrollers",
      "Write software that connects devices to services",
      "Test and troubleshoot connected systems",
    ],
  },
];

type Ctx = { profile: Profile; isSample: boolean; save: (p: Profile) => void };
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(SAMPLE_PROFILE);
  const [isSample, setIsSample] = useState(true);
  return (
    <ProfileContext.Provider
      value={{ profile, isSample, save: (p) => { setProfile(p); setIsSample(false); } }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const c = useContext(ProfileContext);
  if (!c) throw new Error("useProfile outside provider");
  return c;
}

// Real AI analysis is not configured in this prototype.
export const AI_CONFIGURED = false;
