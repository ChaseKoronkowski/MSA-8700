/**
 * Utility function to save LLM-generated results to the database
 */
export async function saveLLMResult({
  content,
  type,
  metadata = {},
  user_identifier,
}: {
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
  user_identifier?: string;
}) {
  try {
    const response = await fetch('/api/llm-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        type,
        metadata,
        user_identifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to save LLM result:', errorData);
      return { success: false, error: errorData.error };
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error saving LLM result:', error);
    return { success: false, error: 'Failed to save LLM result' };
  }
} 