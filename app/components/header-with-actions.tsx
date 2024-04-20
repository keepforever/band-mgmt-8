import React from 'react'

interface HeaderWithActionsProps {
  title: string
  children?: React.ReactNode
}

export const HeaderWithActions: React.FC<HeaderWithActionsProps> = ({ title, children }) => (
  <div className="flex items-center justify-between">
    <h2 className="my-4 text-h5 font-bold">{title}</h2>

    {children}
  </div>
)
