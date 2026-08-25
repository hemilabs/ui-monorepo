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

const DocumentTitleContext = createContext<(title: string | undefined) => void>(
  function ignoreTitle() {},
)

// A single effect owns `document.title`. Writing it from both a layout and its
// route would always resolve in the layout's favour, since effects run child
// first, so routes register their title here instead.
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
      return () => setTitle(undefined)
    },
    [setTitle, title],
  )
}
