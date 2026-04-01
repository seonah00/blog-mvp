// scripts/test-apis.mjs
// 실행 예시:
// node --env-file=.env.local scripts/test-apis.mjs
// node --env-file=.env.local scripts/test-apis.mjs "성수 카페" "서울 성동구"

const queryArg = process.argv[2] || "성수 맛집";
const regionArg = process.argv[3] || "서울 성동구";
const searchTerm = `${regionArg} ${queryArg}`.trim();

const requiredEnv = [
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
  "KAKAO_REST_API_KEY",
  "PERPLEXITY_API_KEY",
];

function mask(value) {
  if (!value) return "(없음)";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function checkEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  console.log("=== ENV CHECK ===");
  for (const key of requiredEnv) {
    console.log(`${key}: ${process.env[key] ? "설정됨" : "없음"} ${process.env[key] ? `(${mask(process.env[key])})` : ""}`);
  }
  console.log("");

  if (missing.length > 0) {
    throw new Error(`누락된 환경변수: ${missing.join(", ")}`);
  }
}

async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

function printDivider(title) {
  console.log(`\n================ ${title} ================`);
}

async function testNaver() {
  printDivider("NAVER LOCAL SEARCH");

  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", searchTerm);
  url.searchParams.set("display", "5");
  url.searchParams.set("sort", "random");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
    },
  });

  const data = await parseJsonSafe(res);

  console.log("status:", res.status, res.statusText);

  if (!res.ok) {
    console.dir(data, { depth: 5 });
    throw new Error("Naver API 호출 실패");
  }

  const items = Array.isArray(data.items) ? data.items : [];
  console.log("result count:", items.length);

  items.slice(0, 3).forEach((item, idx) => {
    const title = String(item.title || "").replace(/<[^>]+>/g, "");
    console.log(`- [${idx + 1}] ${title}`);
    console.log(`  category: ${item.category || "-"}`);
    console.log(`  address: ${item.roadAddress || item.address || "-"}`);
    console.log(`  mapx/mapy: ${item.mapx || "-"} / ${item.mapy || "-"}`);
  });

  return data;
}

async function testKakao() {
  printDivider("KAKAO LOCAL KEYWORD SEARCH");

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", searchTerm);
  url.searchParams.set("size", "5");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  });

  const data = await parseJsonSafe(res);

  console.log("status:", res.status, res.statusText);

  if (!res.ok) {
    console.dir(data, { depth: 5 });
    throw new Error("Kakao API 호출 실패");
  }

  const docs = Array.isArray(data.documents) ? data.documents : [];
  console.log("result count:", docs.length);

  docs.slice(0, 3).forEach((item, idx) => {
    console.log(`- [${idx + 1}] ${item.place_name || "-"}`);
    console.log(`  category: ${item.category_name || "-"}`);
    console.log(`  address: ${item.road_address_name || item.address_name || "-"}`);
    console.log(`  x/y: ${item.x || "-"} / ${item.y || "-"}`);
    console.log(`  phone: ${item.phone || "-"}`);
  });

  return data;
}

async function testPerplexity() {
  printDivider("PERPLEXITY CHAT");

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "Be precise and concise."
        },
        {
          role: "user",
          content: `${searchTerm}에 대해 간단히 알려주세요.`
        }
      ],
      max_tokens: 200,
    }),
  });

  const data = await parseJsonSafe(res);

  console.log("status:", res.status, res.statusText);

  if (!res.ok) {
    console.dir(data, { depth: 5 });
    throw new Error("Perplexity API 호출 실패");
  }

  const content = data.choices?.[0]?.message?.content;
  console.log("응답:", content ? content.slice(0, 200) + "..." : "(없음)");
  
  const citations = data.citations || [];
  console.log("citations:", citations.length);
  citations.slice(0, 3).forEach((url, idx) => {
    console.log(`  [${idx + 1}] ${url}`);
  });

  return data;
}

async function main() {
  try {
    checkEnv();

    console.log("검색어:", searchTerm);

    const results = await Promise.allSettled([
      testNaver(),
      testKakao(),
      testPerplexity(),
    ]);

    printDivider("SUMMARY");

    const labels = ["Naver", "Kakao", "Perplexity"];
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        console.log(`✅ ${labels[idx]}: 성공`);
      } else {
        console.log(`❌ ${labels[idx]}: 실패 -> ${result.reason.message}`);
      }
    });

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("\n치명적 오류:", err.message);
    process.exit(1);
  }
}

main();
