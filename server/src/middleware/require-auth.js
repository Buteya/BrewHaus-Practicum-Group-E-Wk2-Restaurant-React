import { auth } from '../auth.js'

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      res.status(401).json({ error: 'Sign in is required to checkout.' })
      return
    }

    req.authUser = session.user
    next()
  } catch (error) {
    next(error)
  }
}
