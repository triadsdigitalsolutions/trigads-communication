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
                className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 active:scale-95 ${
                    isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
            >
                {icon}
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={`group flex items-center gap-3.5 w-full px-4 py-3 rounded-[12px] transition-all duration-200 active:scale-[0.98] ${
                isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground font-medium"
            }`}
        >
            <span className={`shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                {icon}
            </span>
            <span className="text-[14px] leading-none tracking-tight">{label}</span>
        </Link>
    );
}
