
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<'admin' | 'customer' | 'vendor' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error)
          return
        }

        setRole(data?.role || 'customer')
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole('customer')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  return {
    role,
    loading,
    isVendor: role === 'vendor',
    isAdmin: role === 'admin',
    isCustomer: role === 'customer'
  }
}
