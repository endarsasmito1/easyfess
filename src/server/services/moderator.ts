import { db } from "@/server/db";
import { globalBlacklists, baseBlacklists } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check content against both global and base-specific blacklists.
 * Returns { isClean: true } if content passes, or { isClean: false, matchedWords } if blocked.
 */
export async function moderateContent(
  content: string,
  baseId: string
): Promise<{ isClean: boolean; matchedWords: string[] }> {
  const normalizedContent = content.toLowerCase().trim();

  // Fetch both blacklists in parallel
  const [globalWords, baseWords] = await Promise.all([
    db.select({ word: globalBlacklists.word }).from(globalBlacklists),
    db
      .select({ word: baseBlacklists.word })
      .from(baseBlacklists)
      .where(eq(baseBlacklists.baseId, baseId)),
  ]);

  const allBlacklistWords = [
    ...globalWords.map((w) => w.word.toLowerCase()),
    ...baseWords.map((w) => w.word.toLowerCase()),
  ];

  const matchedWords: string[] = [];

  for (const word of allBlacklistWords) {
    // Use word boundary regex for more accurate matching
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    if (regex.test(normalizedContent)) {
      matchedWords.push(word);
    }
  }

  return {
    isClean: matchedWords.length === 0,
    matchedWords,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
