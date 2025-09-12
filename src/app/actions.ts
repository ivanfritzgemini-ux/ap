"use server";

import {
    confirmParentStudentAccess,
    type ConfirmParentStudentAccessInput,
    type ConfirmParentStudentAccessOutput,
} from '@/ai/flows/parent-student-access';

export async function checkParentAccess(
    input: ConfirmParentStudentAccessInput
): Promise<ConfirmParentStudentAccessOutput> {
    try {
        const result = await confirmParentStudentAccess(input);
        return result;
    } catch (error) {
        console.error("Error in checkParentAccess:", error);
        return {
            isValidAccess: false,
            reason: "An error occurred while processing the request. Please check the server logs.",
        };
    }
}
