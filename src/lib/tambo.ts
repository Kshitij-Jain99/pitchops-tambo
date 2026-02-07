/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 * 
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 * 
 * IMPORTANT: If you have components in different directories (e.g., both ui/ and tambo/),
 * make sure all import paths are consistent. Run 'npx tambo migrate' to consolidate.
 * 
 * Read more about Tambo at https://docs.tambo.co
 */

import type { TamboComponent } from "@tambo-ai/react";
import { KPIDashboard } from "../components/custom/KPIDashboard";
import { NotesEditor } from "../components/custom/NotesEditor";
import { PitchChecklist } from "../components/custom/PitchChecklist";
import { QASimulator } from "../components/custom/QASimulator";


/**
 * Components Array - A collection of Tambo components to register
 * 
 * Components represent UI elements that can be generated or controlled by AI.
 * Register your custom components here to make them available to the AI.
 * 
 * Example of adding a component:
 * 
 * ```typescript
 * import { z } from "zod/v4";
 * import { CustomChart } from "../components/ui/custom-chart";
 * 
 * // Define and add your component
 * export const components: TamboComponent[] = [
 *   {
 *     name: "CustomChart",
 *     description: "Renders a custom chart with the provided data",
 *     component: CustomChart,
 *     propsSchema: z.object({
 *       data: z.array(z.number()),
 *       title: z.string().optional(),
 *     })
 *   }
 * ];
 * ```
 */
export const components: TamboComponent[] = [
  {
    name: "KPIDashboard",
    description:
      "Render when the user wants to review, explain, or validate startup performance metrics for investors.",
    component: KPIDashboard,
    propsSchema: {
      type: "object",
      properties: {
        company: { type: "string" },
        monthlyRevenue: { type: "number" },
        monthlyGrowthPercent: { type: "number" },
        activeUsers: { type: "number" },
        churnRate: { type: "number" },
        burnRate: { type: "number" },
        runwayMonths: { type: "number" },
        showSliders: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "PitchChecklist",
    description:
      "Use when the user is preparing for an investor pitch and needs to track readiness or missing items.",
    component: PitchChecklist,
    propsSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              checked: { type: "boolean" },
            },
            required: ["label"],
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "QASimulator",
    description:
      "Render when the user wants to practice answering investor questions or simulate a pitch Q&A.",
    component: QASimulator,
    propsSchema: {
      type: "object",
      properties: {
        category: { type: "string" },
        questions: {
          type: "array",
          items: { type: "string" },
        },
        answerPlaceholder: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "NotesEditor",
    description:
      "Use when the user wants to write, organize, or refine pitch notes or talking points.",
    component: NotesEditor,
    propsSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        notes: { type: "string" },
        story: { type: "string" },
        risks: { type: "string" },
        talkingPoints: { type: "string" },
        showSections: { type: "boolean" },
        storageKey: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];

// Import your custom components that utilize the Tambo SDK
// import { CustomChart } from "../components/tambo/custom-chart";
