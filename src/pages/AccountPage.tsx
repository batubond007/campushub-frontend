import AccountOverview from '@/features/account/AccountOverview'
import RequireAuth from '@/features/auth/RequireAuth'

// Protected: only signed-in students can open /account.
function AccountPage() {
  return (
    <RequireAuth>
      <AccountOverview />
    </RequireAuth>
  )
}

export default AccountPage
