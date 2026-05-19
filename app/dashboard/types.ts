// ============================================================================
// Dashboard view models.
//
// Plain types only — kept out of actions.ts because a "use server" file may
// export nothing but async functions.
// ============================================================================

/** Live identity block (name, rank, XP) shown at the bottom of the sidebar. */
export interface SidebarIdentity {
  username: string;
  initials: string;
  xp: number;
  rankName: string;
}
