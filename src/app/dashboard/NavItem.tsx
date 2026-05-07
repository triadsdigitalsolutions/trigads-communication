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
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isActive
                        ? "text-primary bg-primary/15"
                        : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
                {isActive && (
                    <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-primary" />
                )}
                {icon}
            </Link>
        );
    }

    return (
        <Link
            href={href}
            title={label}
            className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                isActive
                    ? "bg-primary/20 text-primary"
                    : "text-sidebar-foreground/35 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
        >
            {/* Active pill */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
            )}
            {icon}
            {/* Tooltip */}
            <span className="
                absolute left-full ml-2.5 px-2 py-1
                bg-sidebar-accent border border-sidebar-border
                text-[10px] font-semibold tracking-wide text-sidebar-foreground
                rounded-lg whitespace-nowrap shadow-elevated
                opacity-0 invisible pointer-events-none
                group-hover:opacity-100 group-hover:visible
                transition-all duration-150 z-50
            ">
                {label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-sidebar-border" />
            </span>
        </Link>
    );
}
