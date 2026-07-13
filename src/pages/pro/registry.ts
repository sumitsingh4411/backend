import {
  PRO_TOPICS,
  type ProSection,
  type ProTopic,
} from "../../lib/proTopics";
import { databasesSections } from "./Databases";
import { apisSections } from "./Apis";
import { securitySections } from "./Security";
import { cachingSections } from "./Caching";
import { performanceSections } from "./Performance";
import { reliabilitySections } from "./Reliability";
import { devopsSections } from "./DevOps";
import { systemDesignSections } from "./SystemDesign";

/** topic id → its pages, in reading order. Keys must match PRO_TOPICS ids. */
export const PRO_SECTIONS: Record<string, ProSection[]> = {
  databases: databasesSections,
  apis: apisSections,
  security: securitySections,
  caching: cachingSections,
  performance: performanceSections,
  reliability: reliabilitySections,
  devops: devopsSections,
  "system-design": systemDesignSections,
};

export const getSections = (topicId?: string): ProSection[] =>
  (topicId && PRO_SECTIONS[topicId]) || [];

export const getSection = (topicId?: string, sectionId?: string) =>
  getSections(topicId).find((s) => s.id === sectionId);

export interface FlatSection {
  topic: ProTopic;
  section: ProSection;
}

/** Every page on the shelf, in order — powers prev/next across topics. */
export const FLAT_SECTIONS: FlatSection[] = PRO_TOPICS.flatMap((topic) =>
  getSections(topic.id).map((section) => ({ topic, section })),
);

export const flatIndex = (topicId: string, sectionId: string) =>
  FLAT_SECTIONS.findIndex(
    (f) => f.topic.id === topicId && f.section.id === sectionId,
  );
