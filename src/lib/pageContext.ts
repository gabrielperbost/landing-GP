export const CITY_92_PREFIX = "/assurance-de-pret/hauts-de-seine/";

export const getCitySlugFromPath = (pathname: string): string => {
  if (!pathname.startsWith(CITY_92_PREFIX)) return "";
  const slug = pathname.slice(CITY_92_PREFIX.length).split("/")[0]?.trim() ?? "";
  return slug;
};

export const getPageTypeFromPath = (pathname: string): "landing_home" | "landing_city_92" | "other" => {
  if (pathname === "/") return "landing_home";
  if (pathname.startsWith(CITY_92_PREFIX)) return "landing_city_92";
  return "other";
};
