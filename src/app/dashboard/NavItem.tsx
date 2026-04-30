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
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                    isActive
                        ? "text-primary bg-primary/15"
                        : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
                {isActive && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                {icon}
            </Link>
        );
    }

    return (
        <Link
            href={href}
            title={label}
            className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                isActive
                    ? "bg-primary/20 text-primary"
                    : "text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
        >
            {/* Active indicator bar */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
            )}
            {icon}
            {/* Label tooltip on hover */}
            <span className="
                absolute left-full ml-3 px-2.5 py-1
                bg-sidebar-accent border border-sidebar-border
                text-[10px] font-black uppercase tracking-widest text-sidebar-foreground
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
