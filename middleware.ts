import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0];
  const liveHost = host === 'sridevinightchart.com' || host === 'www.sridevinightchart.com';
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? request.nextUrl.protocol.replace(':', '');
  if (process.env.NODE_ENV === 'production' && liveHost && (host?.startsWith('www.') || protocol === 'http')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = 'sridevinightchart.com';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
