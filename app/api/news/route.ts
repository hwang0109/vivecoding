import { NextResponse } from 'next/server';

const FEEDS = [
  { url: 'https://www.yna.co.kr/rss/all.xml', source: '연합뉴스' },
  { url: 'https://www.ytn.co.kr/_ln/rss/', source: 'YTN' },
];

function getCategory(title: string) {
  if (/정치|대통령|국회|여야|총리|장관|의원/.test(title)) return '정치';
  if (/경제|주식|코스피|증시|금리|환율|수출|무역|GDP|물가/.test(title)) return '경제';
  if (/외교|미국|중국|일본|러시아|유럽|UN|북한|트럼프/.test(title)) return '국제';
  if (/IT|AI|인공지능|반도체|삼성|애플|구글|기술|스마트/.test(title)) return '기술';
  return '사회';
}

function getTime(pubDate: string) {
  const diff = Math.floor((Date.now() - new Date(pubDate).getTime()) / 60000);
  if (diff < 1) return '방금 전';
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

function parseRSS(xml: string, source: string) {
  const items: object[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const get = (tag: string) =>
      m[1].match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`))?.[1]?.trim() ?? '';

    const title = get('title').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const link = get('link') || get('guid');
    const desc = get('description').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').slice(0, 200);
    const pubDate = get('pubDate');

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
      body: desc || title,
      bookmarked: false,
      translated: false,
      translatedBody: null,
    });

    if (items.length >= 10) break;
  }
  return items;
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(f =>
      fetch(f.url, { next: { revalidate: 300 } })
        .then(r => r.text())
        .then(xml => parseRSS(xml, f.source))
    )
  );

  const articles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<object[]>).value);

  articles.forEach((a: object, i) => ((a as { id: number }).id = i + 1));

  return NextResponse.json(articles);
}
