import { createContext, useContext } from 'react'

// Who is logged in to the admin, and what they're allowed to do.
// Provided by AdminGate once it has loaded the person's row from the
// `staff` table. Shape: { userId, name, role, isAdmin }
export const StaffContext = createContext(null)

export function useStaff() {
  return useContext(StaffContext)
}
