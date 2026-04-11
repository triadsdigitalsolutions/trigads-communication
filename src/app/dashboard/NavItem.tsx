"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={`group relative flex flex-col items-center justify-center transition-all duration-500 md:gap-1 h-[3.25rem] ${
                isActive ? 'w-20 md:w-12 bg-foreground/10 md:bg-transparent rounded-full' : 'w-12 md:w-12'
            }`}
        >
            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive 
                    ? 'text-foreground md:bg-primary/10' 
                    : 'text-muted-foreground group-hover:text-foreground md:group-hover:bg-primary/10'
            }`}>
                {icon}
            </div>
            <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 text-center">
                {label}
            </span>
        </Link>
    );
}
