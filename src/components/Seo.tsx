import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { SITE_NAME, DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, absoluteUrl } from "@/config/site";

type SeoProps = {
  title: string;
  description: string;
  /** 站內路徑，例如 "/faq"；用來產生 canonical 與 og:url */
  path: string;
  /** 絕對網址或站內路徑；未提供時使用網站預設分享圖 */
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  children?: ReactNode;
};

const Seo = ({ title, description, path, image, type = "website", noindex = false, children }: SeoProps) => {
  const url = absoluteUrl(path);
  const isDefaultImage = !image;
  const src = image ?? DEFAULT_OG_IMAGE;
  const imageUrl = src.startsWith("http") ? src : absoluteUrl(src);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
      {!noindex && <link rel="canonical" href={url} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="zh_TW" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      {isDefaultImage && <meta property="og:image:width" content="1200" />}
      {isDefaultImage && <meta property="og:image:height" content="630" />}
      {isDefaultImage && <meta property="og:image:alt" content={DEFAULT_OG_IMAGE_ALT} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {children}
    </Helmet>
  );
};

export default Seo;
