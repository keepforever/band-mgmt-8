import React from 'react'

interface HeaderWithActionsProps {
  title: string
  children?: React.ReactNode
  searchInput?: React.ReactNode
}

export const HeaderWithActions: React.FC<HeaderWithActionsProps> = ({ title, children, searchInput }) => (
  <div className="flex flex-wrap-reverse items-center justify-between">
    <div>
      <h2 className="my-4 text-h5 font-bold">{title}</h2>
      {searchInput}
    </div>

    {children}
  </div>
)
