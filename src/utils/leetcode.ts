export interface LeetCodeStats {
  totalSolved: number
  totalQuestions: number
  easySolved: number
  easyTotal: number
  mediumSolved: number
  mediumTotal: number
  hardSolved: number
  hardTotal: number
  ranking: number
  acceptanceRate: number
}

interface QuestionCount {
  count: number
  difficulty: string
}

interface LeetCodeCNResponse {
  data: {
    userProfileUserQuestionProgress: {
      numAcceptedQuestions: QuestionCount[]
      numFailedQuestions: QuestionCount[]
      numUntouchedQuestions: QuestionCount[]
    }
    userProfilePublicProfile: {
      siteRanking: number
    }
  }
}

const QUERY = `
query getUserProfile($username: String!) {
  userProfileUserQuestionProgress(userSlug: $username) {
    numAcceptedQuestions { count difficulty }
    numFailedQuestions { count difficulty }
    numUntouchedQuestions { count difficulty }
  }
  userProfilePublicProfile(userSlug: $username) {
    siteRanking
  }
}`

async function fetchLeetCodeCN(username: string): Promise<LeetCodeCNResponse> {
  const resp = await fetch("https://leetcode.cn/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://leetcode.cn",
      Referer: "https://leetcode.cn",
    },
    body: JSON.stringify({
      operationName: "getUserProfile",
      variables: { username },
      query: QUERY,
    }),
  })
  if (!resp.ok) {
    throw new Error(`LeetCode CN API error: ${resp.status}`)
  }
  return resp.json()
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  try {
    const json = await fetchLeetCodeCN(username)
    const progress = json.data.userProfileUserQuestionProgress
    const ranking = json.data.userProfilePublicProfile.siteRanking

    const getCount = (list: QuestionCount[], diff: string) =>
      list.find((d) => d.difficulty === diff)?.count ?? 0

    const easySolved = getCount(progress.numAcceptedQuestions, "EASY")
    const mediumSolved = getCount(progress.numAcceptedQuestions, "MEDIUM")
    const hardSolved = getCount(progress.numAcceptedQuestions, "HARD")

    const easyFailed = getCount(progress.numFailedQuestions, "EASY")
    const mediumFailed = getCount(progress.numFailedQuestions, "MEDIUM")
    const hardFailed = getCount(progress.numFailedQuestions, "HARD")

    const easyUntouched = getCount(progress.numUntouchedQuestions, "EASY")
    const mediumUntouched = getCount(progress.numUntouchedQuestions, "MEDIUM")
    const hardUntouched = getCount(progress.numUntouchedQuestions, "HARD")

    const easyTotal = easySolved + easyFailed + easyUntouched
    const mediumTotal = mediumSolved + mediumFailed + mediumUntouched
    const hardTotal = hardSolved + hardFailed + hardUntouched
    const totalSolved = easySolved + mediumSolved + hardSolved
    const totalQuestions = easyTotal + mediumTotal + hardTotal

    return {
      totalSolved,
      totalQuestions,
      easySolved,
      easyTotal,
      mediumSolved,
      mediumTotal,
      hardSolved,
      hardTotal,
      ranking,
      acceptanceRate:
        totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0,
    }
  } catch (e) {
    console.error("Failed to fetch LeetCode stats:", e)
    return null
  }
}
