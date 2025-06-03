import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert text description into bullet points using OpenAI
 */
export async function generateBulletPoints(description: string): Promise<string[]> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a product description expert. Convert the given product description into 3-5 clear, concise bullet points that highlight the key features and benefits. Each bullet point should be actionable and compelling. Return your response as JSON in this exact format: {\"bullet_points\": [\"point 1\", \"point 2\", \"point 3\"]}"
        },
        {
          role: "user",
          content: `Please convert this product description into bullet points: "${description}"`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI response content:', content);
    
    if (!content) {
      console.log('No content received from OpenAI');
      return [];
    }
    
    const result = JSON.parse(content);
    console.log('Parsed result:', result);
    
    return result.bullet_points || [];
  } catch (error) {
    console.error('Error generating bullet points:', error);
    throw new Error('Failed to generate bullet points');
  }
}