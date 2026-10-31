import { Link } from 'react-router'

export function NotFound() {
  return (
    <main className="page narrow">
      <h1>Sidan finns inte</h1>
      <p>
        <Link to="/">Till startsidan</Link>
      </p>
    </main>
  )
}
