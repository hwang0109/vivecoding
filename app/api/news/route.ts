import { NextResponse } from 'next/server';

const FEEDS = [
  { url: 'https://news.google.com/rss/search?q=site:yna.co.kr&hl=ko&gl=KR&ceid=KR:ko', source: '연합뉴스' },
  { url: 'https://news.google.com/rss/search?q=site:ytn.co.kr&hl=ko&gl=KR&ceid=KR:ko', source: 'YTN' },
  { url: 'https://news.google.com/rss/search?q=%EB%8B%A8%EB%8F%85+%ED%95%9C%EA%B5%AD+%EB%89%B4%EC%8A%A4&hl=ko&gl=KR&ceid=KR:ko', source: '단독' },
];

function getCategory(title: string) {
  if (/정치|대통령|국회|여야|총리|장관|의원|민주당|국민의힘/.test(title)) return '정치';
  if (/경제|주식|코스피|증시|금리|환율|수출|무역|GDP|물가|부동산/.test(title)) return '경제';
  if (/외교|미국|중국|일본|러시아|유럽|UN|북한|트럼프|바이든/.test(title)) return '국제';
  if (/IT|AI|인공지능|반도체|삼성|애플|구글|기술|스마트|챗GPT/.test(title)) return '기술';
  return '사회';
}

function getTime(pubDate: string) {
  const diff = Math.floor((Date.now() - new Date(pubDate).getTime()) / 60000);
  if (diff < 1) return '방금 전';
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

function parseRSS(xml: string, defaultSource: string) {
  const items: object[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const get = (tag: string) =>
      m[1].match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`))?.[1]?.trim() ?? '';

    const rawTitle = get('title').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    const link = get('link') || get('guid');
    const pubDate = get('pubDate');

    // Google News 제목 형식: "기사제목 - 언론사명"
    const dashIdx = rawTitle.lastIndexOf(' - ');
    const title = dashIdx > 0 ? rawTitle.slice(0, dashIdx) : rawTitle;
    const source = dashIdx > 0 ? rawTitle.slice(dashIdx + 3) : defaultSource;

    if (!title) continue;

    const badge = /\[?속보\]?/.test(title) ? '속보' : /\[?단독\]?/.test(title) ? '단독' : null;

    items.push({
      id: items.length + 1,
      badge,
      category: getCategory(title),
      title,
      titleKo: title,
      source,
      time: pubDate ? getTime(pubDate) : '방금 전',
      lang: 'ko',
      url: link,
      body: title,
      bookmarked: false,
      translated: false,
      translatedBody: null,
    });

    if (items.length >= 8) break;
  }
  return items;
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(f =>
      fetch(f.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
        next: { revalidate: 300 },
      })
        .then(r => r.text())
        .then(xml => parseRSS(xml, f.source))
    )
  );

  const seen = new Set<string>();
  const articles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<object[]>).value)
    .filter(a => {
      const key = (a as { title: string }).title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  articles.forEach((a, i) => ((a as { id: number }).id = i + 1));

  return NextResponse.json(articles);
}
