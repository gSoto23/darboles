import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Países que hablan español (Código ISO 2).
const SPANISH_SPEAKING_COUNTRIES = ['ES', 'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ', 'PR'];

export function proxy(request: NextRequest) {
  // 0. Redirect www.darboles.com to the canonical apex domain (avoids duplicate-content indexing)
  // Built from scratch (not request.nextUrl.clone()) because behind the nginx reverse proxy,
  // nextUrl reflects the internal http://localhost:3000 connection, not the public https URL —
  // cloning it produced a redirect to http://darboles.com:3000, unreachable from the internet.
  const host = request.headers.get('host') || '';
  if (host === 'www.darboles.com') {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://darboles.com');
    return NextResponse.redirect(url, 308);
  }

  // 1. Extrapolate country from Vercel's geo header if available
  const country = request.headers.get('x-vercel-ip-country') || 'US';

  const response = NextResponse.next();
  
  // 2. Set the country cookie
  response.cookies.set('NEXT_COUNTRY', country, { path: '/' });

  // 3. Check if they already have the language cookie mapped
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

    if (!cookieLocale) {
      // 4. Set default locale to 'es' always
      response.cookies.set('NEXT_LOCALE', 'es', { path: '/' });
    }

  return response;
}

export const config = {
  // Only run middleware on non-static/api routes to be efficient
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
