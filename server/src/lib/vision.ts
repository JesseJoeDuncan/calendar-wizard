import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

export interface RankableCandidate {
  url: string;
}

export interface RankResult {
  bestIndex: number;
  reason: string;
}

/**
 * Asks Claude to look at candidate movie stills and pick the one best suited to a
 * background-removal cutout: one clear, well-lit, unoccluded subject, not cropped at
 * the frame edge. Returns null if no ANTHROPIC_API_KEY is configured or on any failure,
 * so callers can fall back to the plain TMDB-ranked order.
 */
export async function pickBestImageForCutout(candidates: RankableCandidate[], titleName: string): Promise<RankResult | null> {
  const anthropic = getClient();
  if (!anthropic || candidates.length === 0) return null;

  try {
    const imageBlocks = await Promise.all(
      candidates.map(async (c) => {
        const res = await fetch(c.url);
        if (!res.ok) throw new Error(`Failed to fetch candidate image: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        return {
          type: "image" as const,
          source: { type: "base64" as const, media_type: "image/jpeg" as const, data: buf.toString("base64") },
        };
      })
    );

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 300,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              best_index: { type: "integer" },
              reason: { type: "string" },
            },
            required: ["best_index", "reason"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `These are ${candidates.length} candidate stills for the movie "${titleName}", numbered 0 to ${candidates.length - 1} in the order shown. Pick the single best one for a background-removal "cutout" effect: it should have one clear, well-lit, unoccluded subject (a person or a small group) with strong separation from the background, minimal motion blur, and the subject should not be cropped at the frame edge. Respond with the index of the best image and a one-sentence reason.`,
            },
            ...imageBlocks,
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const parsed = JSON.parse(textBlock.text) as { best_index: number; reason: string };
    if (parsed.best_index < 0 || parsed.best_index >= candidates.length) return null;
    return { bestIndex: parsed.best_index, reason: parsed.reason };
  } catch (err) {
    console.error("Vision ranking failed, falling back to default order", err);
    return null;
  }
}
