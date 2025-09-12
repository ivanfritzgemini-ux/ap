// This file is machine-generated - edit with care!
'use server';
/**
 * @fileOverview A Genkit flow to confirm that a parent only has access to their children's data.
 *
 * - confirmParentStudentAccess - A function that confirms parent-student access.
 * - ConfirmParentStudentAccessInput - The input type for the confirmParentStudentAccess function.
 * - ConfirmParentStudentAccessOutput - The return type for the confirmParentStudentAccess function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfirmParentStudentAccessInputSchema = z.object({
  parentId: z.string().describe('The ID of the parent user.'),
  studentIds: z.array(z.string()).describe('An array of IDs of the students the parent should have access to.'),
  accessibleStudentIds: z.array(z.string()).describe('An array of IDs of the students the parent currently has access to.'),
});
export type ConfirmParentStudentAccessInput = z.infer<typeof ConfirmParentStudentAccessInputSchema>;

const ConfirmParentStudentAccessOutputSchema = z.object({
  isValidAccess: z.boolean().describe('Whether the parent only has access to the specified students.'),
  reason: z.string().describe('The reason why the parent access is valid or invalid.'),
});
export type ConfirmParentStudentAccessOutput = z.infer<typeof ConfirmParentStudentAccessOutputSchema>;

export async function confirmParentStudentAccess(
  input: ConfirmParentStudentAccessInput
): Promise<ConfirmParentStudentAccessOutput> {
  return confirmParentStudentAccessFlow(input);
}

const confirmParentStudentAccessPrompt = ai.definePrompt({
  name: 'confirmParentStudentAccessPrompt',
  input: {schema: ConfirmParentStudentAccessInputSchema},
  output: {schema: ConfirmParentStudentAccessOutputSchema},
  prompt: `You are an AI expert in access control and data security. Your task is to determine if a parent has correct access to student information based on the provided data.

Parent ID: {{parentId}}
Authorized Student IDs: {{studentIds}}
Accessible Student IDs: {{accessibleStudentIds}}

Determine if the parent only has access to the authorized students. If the parent has access to students they should not have access to, or if they are missing access to students they should have access to, then the access is invalid. Explain the reason for the determination.

Respond with a JSON object in the following format:
{
  "isValidAccess": boolean, // true if access is valid, false otherwise
  "reason": string // Explanation of why the access is valid or invalid
}
`,
});

const confirmParentStudentAccessFlow = ai.defineFlow(
  {
    name: 'confirmParentStudentAccessFlow',
    inputSchema: ConfirmParentStudentAccessInputSchema,
    outputSchema: ConfirmParentStudentAccessOutputSchema,
  },
  async input => {
    const {output} = await confirmParentStudentAccessPrompt(input);
    return output!;
  }
);
