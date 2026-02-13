// src/components/AppSidebar.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext"; // <-- new: get current user
import { ChevronDownIcon, GridIcon, HorizontaLDots, PageIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  allowedRoles?: string[]; // optional override per sub-item
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
  allowedRoles?: string[]; // which roles may see this item; undefined = visible to all
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin-dashboard",
    allowedRoles: ["SuperAdmin", "Admin", "Staff"],
  },
  {
    name: "Epaper",
    icon: <PageIcon />,
    subItems: [
      {
        name: "Add New Epaper",
        path: "/admin-dashboard/epapers/create",
        pro: false,
        allowedRoles: ["SuperAdmin", "Admin"], // only Admins & SuperAdmin can create
      },
      {
        name: "All Epaper",
        path: "/admin-dashboard/epapers/",
        pro: false,
        allowedRoles: ["SuperAdmin", "Admin", "Staff"], // staff can view list
      },
    ],
    allowedRoles: ["SuperAdmin", "Admin", "Staff"],
  },
  {
    name: "User",
    icon: <PageIcon />,
    subItems: [
      {
        name: "User Register",
        path: "/admin-dashboard/users/create",
        pro: false,
        allowedRoles: ["SuperAdmin", "Admin"],
      },
      {
        name: "All User",
        path: "/admin-dashboard/users/",
        pro: false,
        allowedRoles: ["SuperAdmin", "Admin"],
      },
    ],
    allowedRoles: ["SuperAdmin", "Admin"], // staff cannot see User menu
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user: currentUser } = useAuth(); // <-- use current user from context

  // track open submenu
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  /** Helper: whether the current user has access to a nav item/sub-item */
  const hasAccess = (allowedRoles?: string[] | undefined) => {
    // If allowedRoles not provided -> visible to everyone
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const role = currentUser?.role;
    if (!role) return false;
    // Allow if user role is included
    return allowedRoles.includes(role);
  };

  useEffect(() => {
    // Open parent submenu if current path matches any subItem
    let matched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            // but only open if the parent and subItem are accessible
            if (
              hasAccess(nav.allowedRoles) &&
              hasAccess(subItem.allowedRoles)
            ) {
              setOpenSubmenu(index);
              matched = true;
            }
          }
        });
      } else if (nav.path && isActive(nav.path)) {
        if (hasAccess(nav.allowedRoles)) {
          setOpenSubmenu(null);
          matched = true;
        }
      }
    });

    if (!matched) {
      setOpenSubmenu(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, currentUser]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    // Only toggle if the parent item is accessible
    if (!hasAccess(navItems[index].allowedRoles)) return;
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        // Skip entire item if not allowed for current user
        if (!hasAccess(nav.allowedRoles)) return null;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <>
                <button
                  onClick={() => handleSubmenuToggle(index)}
                  className={`menu-item group ${
                    openSubmenu === index
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size  ${
                      openSubmenu === index
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenu === index ? "rotate-180 text-brand-500" : ""
                      }`}
                    />
                  )}
                </button>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <div
                    ref={(el) => {
                      subMenuRefs.current[`main-${index}`] = el;
                    }}
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      height:
                        openSubmenu === index
                          ? `${subMenuHeight[`main-${index}`] || 0}px`
                          : "0px",
                    }}
                  >
                    <ul className="mt-2 space-y-1 ml-9">
                      {nav.subItems.map((subItem) => {
                        // Skip sub item if not allowed
                        if (!hasAccess(subItem.allowedRoles)) return null;

                        return (
                          <li key={subItem.name}>
                            <Link
                              to={subItem.path}
                              className={`menu-dropdown-item ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-item-active"
                                  : "menu-dropdown-item-inactive"
                              }`}
                            >
                              {subItem.name}
                              <span className="flex items-center gap-1 ml-auto">
                                {subItem.new && (
                                  <span
                                    className={`ml-auto ${
                                      isActive(subItem.path)
                                        ? "menu-dropdown-badge-active"
                                        : "menu-dropdown-badge-inactive"
                                    } menu-dropdown-badge`}
                                  >
                                    new
                                  </span>
                                )}
                                {subItem.pro && (
                                  <span
                                    className={`ml-auto ${
                                      isActive(subItem.path)
                                        ? "menu-dropdown-badge-active"
                                        : "menu-dropdown-badge-inactive"
                                    } menu-dropdown-badge`}
                                  >
                                    pro
                                  </span>
                                )}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/afternoon-epaper-logo.png"
                alt="Logo"
                width={320}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/afternoon-epaper-logo.png"
                alt="Logo"
                width={320}
                height={40}
              />
            </>
          ) : (
            <img src="/favicon.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>

              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
