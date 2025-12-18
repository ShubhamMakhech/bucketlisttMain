import React from "react";

interface CertificationBadge {
  imageUrl: string;
  title: string;
  description: string;
}

const certifications: CertificationBadge[] = [
  {
    imageUrl:
      "https://www.himalayanhikers.in/wp-content/uploads/2025/04/ALLIED-logo.jpg",
    title: "ATOAI Certified",
    description: "Adventure Tour Operators Association of India certified",
  },
  {
    imageUrl:
      "https://cdn.vectorstock.com/i/500p/15/96/check-mark-icon-stamp-vector-11241596.jpg",
    title: "Equipment Checked",
    description: "All equipment thoroughly inspected and verified",
  },
  {
    imageUrl:
      "https://static.vecteezy.com/ti/vecteur-libre/t1/1991640-guides-design-plat-concept-illustrationle-icon-manuel-utilisateur-redaction-du-contrat-comment-aux-exigences-specifications-document-resume-metaphore-peut-utiliser-pour-page-de-destination-mobile-app-gratuit-vectoriel.jpg",
    title: "Trained Vendor",
    description: "Professionally trained and certified guides",
  },
];

export const CertificationBadges: React.FC = () => {
  return (
    <div className="w-full py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {certifications.map((cert, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-6 bg-card border border-border rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 hover:border-brand-primary/30 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 mb-4 rounded-xl overflow-hidden bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
              <img
                src={cert.imageUrl}
                alt={cert.title}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2 text-foreground group-hover:text-brand-primary transition-colors duration-300">
              {cert.title}
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed group-hover:text-foreground transition-colors duration-300">
              {cert.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
