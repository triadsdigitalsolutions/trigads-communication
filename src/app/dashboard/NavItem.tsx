"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    mobile?: boolean;
}

export function NavItem({ href, icon, label, mobile }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + "/");

    if (mobile) {
        return (
            <Link
                href={href}
                title={label}
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                    isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-sidebar-foreground/60 hover:text-foreground hover:bg-secondary"
                }`}
            >
                {icon}
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-glow-soft"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
            }`}
        >
            <span className={`shrink-0 ${isActive ? "text-primary-foreground" : "text-sidebar-foreground/70"}`}>
                {icon}
            </span>
            <span className="text-[13.5px] font-medium leading-none">{label}</span>
        </Link>
    );
}
