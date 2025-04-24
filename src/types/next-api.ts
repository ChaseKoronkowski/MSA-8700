import { NextRequest } from 'next/server';

// Define types for route handlers with dynamic parameters
export type RouteHandlerContext<T extends Record<string, string>> = {
  params: T;
};

// Use this for [id] routes
export type IdRouteContext = RouteHandlerContext<{ id: string }>;

// Use for other dynamic routes as needed
export type SlugRouteContext = RouteHandlerContext<{ slug: string }>; 