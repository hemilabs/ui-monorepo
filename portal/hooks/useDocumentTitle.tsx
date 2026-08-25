import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type Props = {
  children: ReactNode
  defaultTitle: string
}

const DocumentTitleContext = createContext<(title?: string) => void>(
  function ignoreTitle() {},
)

// The registration has to go through state: the provider owns the only write,
// so it can fall back to `defaultTitle` on a route that claims no title, and a
// layout writing `document.title` itself would beat its own route anyway, since
// effects run child first.
export const DocumentTitleProvider = function ({
  children,
  defaultTitle,
}: Props) {
  const [title, setTitle] = useState<string>()

  useEffect(
    function applyDocumentTitle() {
      document.title = title ?? defaultTitle
    },
    [defaultTitle, title],
  )

  return (
    <DocumentTitleContext.Provider value={setTitle}>
      {children}
    </DocumentTitleContext.Provider>
  )
}

// Call once per route. Nesting two calls is unsupported: the outer one wins.
export const useDocumentTitle = function (title: string) {
  const setTitle = useContext(DocumentTitleContext)

  useEffect(
    function claimDocumentTitle() {
      setTitle(title)
      return () => setTitle()
    },
    [setTitle, title],
  )
}
