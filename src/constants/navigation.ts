import { UserRole } from "@/types";
import { Href } from "expo-router";

export type NavigationItem = {
  label: string;
  path: string;
};

export const adminNavigation: NavigationItem[] = [
  { label: "Beranda", path: "/admin/dashboard" },
  { label: "Data Kamar", path: "/admin/kamar" },
  { label: "Data Penghuni", path: "/admin/penghuni" },
  { label: "Laporan Keuangan", path: "/admin/laporan" },
  { label: "Tagihan", path: "/admin/tagihan" },
  { label: "Tamu", path: "/admin/tamu" },
  { label: "Keluhan", path: "/admin/keluhan" },
  { label: "Profil", path: "/admin/profil" },
];

export const penyewaNavigation: NavigationItem[] = [
  { label: "Beranda", path: "/penyewa/dashboard" },
  { label: "Tagihan & Invoice", path: "/penyewa/tagihan" },
  { label: "Tamu", path: "/penyewa/tamu" },
  { label: "Keluhan", path: "/penyewa/keluhan" },
  { label: "Profil", path: "/penyewa/profil" },
];

const HOME_ROUTE_BY_ROLE: Record<UserRole, Href> = {
  admin: "/admin/dashboard",
  penyewa: "/penyewa/dashboard",
};

export function getHomeRoute(role: UserRole): Href {
  return HOME_ROUTE_BY_ROLE[role];
}
