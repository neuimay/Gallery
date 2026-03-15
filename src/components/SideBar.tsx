import { logo, Home, Tag, Map, Day, Night, Sort} from '@/assets/icons'
import config from '@/config.json'
import {useLocation, Link} from 'react-router-dom'

interface Props {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export default function SideBar({ theme, toggleTheme }: Props) {

  const navBtn =
  "group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300"
  //const hover = "absolute inset-0 rounded-xl bg-primary/10 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-primary/20 backdrop-blur-xl"
  const iconHover = "relative z-10 w-6 h-6 text-primary/50 transition-all duration-300 group-hover:text-primary group-hover:scale-110 "
  
  const location = useLocation()
  const isHome = location.pathname === '/'

  // const hoverBg = (active: boolean) => `
  // absolute inset-0 rounded-xl backdrop-blur-xl transition-all duration-300
  // ${
  //   active
  //     ? 'bg-primary/20 opacity-100'
  //     : 'bg-primary/10 opacity-0 group-hover:opacity-100 group-hover:bg-primary/20'
  // }`

  const iconStyle = (active: boolean) => `
  relative z-10 w-6 h-6 transition-all duration-300
  ${
    active
      ? 'text-primary'
      : 'text-primary/50 group-hover:text-white group-hover:scale-110'
  }
`

  return (
    <aside
      className="
        fixed
        z-50
        bg-root

        /* 桌面端 */
        md:w-12 md:h-screen md:flex md:flex-col md:justify-between md:items-center md:py-6 md:static

        /* 移动端 */
        w-full h-12 bottom-0 left-0
        flex flex-row justify-around items-center
        border-t border-white/10
      "
    >
      
      {/* Top */}
      <div className="hidden md:block">
        <img src={logo} className="w-9" />
      </div>

      {/* Nav */}
      <nav className="flex flex-row md:flex-col gap-8 md:gap-6">

        <button className={navBtn}>
          {/* <span className={hoverBg(isHome)}/> */}
          <Home className={iconStyle(isHome)}/>
        </button>

        <button className={navBtn} title='coming soon'>
          {/* <span className={hover}/> */}
          <Tag className={iconHover}/>
        </button>

        <Link to="/map" className={navBtn}>
          {/* <span className={hover}/> */}
          <Map className={iconHover}/>
        </Link>


        <button className={navBtn} title='coming soon'>
          {/* <span className={hover}/> */}
          <Sort className={iconHover}/>
        </button>

        {/* 🌙 Theme Toggle */}
        <button onClick={toggleTheme} className={navBtn}>
        {/* <span className={hover}/> */}
          {theme === 'dark' ? (
            <Day className={iconHover} />
          ) : (
            <Night className={iconHover} />
          )}
        </button>

      </nav>

      {/* Bottom */}
      <div className="hidden md:block">
        <a
          href={config.author.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={config.author.avatar}
            alt={config.author.name}
            className="w-8 h-8 rounded-full"
          />
        </a>
      </div>
    </aside>
  )
}
