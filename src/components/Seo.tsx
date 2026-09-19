import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { SITE_NAME, absoluteUrl } from "@/config/site";

type SeoProps = {
  title: string;
  description: string;
  /** 站內路徑，例如 "/faq"；用來產生 canonical 與 og:url */
  path: string;
  /** 絕對網址或站內路徑；未提供時不輸出 og:image */
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  children?: ReactNode;
};

const Seo = ({ title, description, path, image, type = "website", noindex = false, children }: SeoProps) => {
  const url = absoluteUrl(path);
  const imageUrl = image ? (image.startsWith("http") ? image : absoluteUrl(image)) : null;

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
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {children}
    </Helmet>
  );
};

export default Seo;
