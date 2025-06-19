import * as React from "react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastState {
  toasts: ToastProps[]
}

type ToastAction = 
  | { type: "ADD_TOAST"; toast: ToastProps }
  | { type: "REMOVE_TOAST"; id: string }

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      }
    default:
      return state
  }
}

const ToastContext = React.createContext<{
  toasts: ToastProps[]
  toast: (props: Omit<ToastProps, "id">) => void
  dismiss: (id: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] })

  const toast = React.useCallback(
    (props: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substr(2, 9)
      dispatch({ type: "ADD_TOAST", toast: { ...props, id } })
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", id })
      }, 5000)
    },
    []
  )

  const dismiss = React.useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_TOAST", id })
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}