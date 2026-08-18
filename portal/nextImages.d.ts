// Types static image imports as next/image's StaticImageData, which is what
// the ~60 `<Image src={logo} />` call sites still expect.
//
// WARNING: this is the Next shape, not the Vite one. Vite resolves an image
// import to a plain URL string, so once these files enter the Vite graph the
// declared type will be a lie: `src.width` is undefined at runtime and next/image
// throws "missing required width property", with no type error to warn you.
// Delete this file in the same change that replaces next/image with <img>.
/// <reference types="next/image-types/global" />
