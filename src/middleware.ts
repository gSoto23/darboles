import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Países que hablan español (Código ISO 2).
const SPANISH_SPEAKING_COUNTRIES = ['ES', 'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ', 'PR'];

export function middleware(request: NextRequest) {
  // 1. Extrapolate country from Vercel's geo header if available
  const country = request.headers.get('x-vercel-ip-country') || 'US';

  const response = NextResponse.next();
  
  // 2. Set the country cookie
  response.cookies.set('NEXT_COUNTRY', country, { path: '/' });

  // 3. Check if they already have the language cookie mapped
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  if (!cookieLocale) {
    // 4. Set default locale based on country code if none exists
    const inferredLocale = SPANISH_SPEAKING_COUNTRIES.includes(country) ? 'es' : 'en';
    response.cookies.set('NEXT_LOCALE', inferredLocale, { path: '/' });
  }

  return response;
}

export const config = {
  // Only run middleware on non-static/api routes to be efficient
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
