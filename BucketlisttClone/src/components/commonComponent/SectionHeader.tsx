import React from 'react';

interface SectionHeaderProps {
    icon: string;
    tag: string;
    heading: string | React.ReactNode;
    alignment?: 'start' | 'center';
    maxWidth?: '600' | '800' | '1000';
    withMargin?: boolean;
    iconStyle?: 'default' | 'white-circle';
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    icon,
    tag,
    heading,
    alignment = 'center',
    maxWidth,
    withMargin = false,
    iconStyle = 'default'
}) => {
    const alignmentClass = alignment === 'start' ? 'textAlignStart' : 'textAlignCenter';
    const maxWidthClass = maxWidth
        ? (withMargin ? `MaxWidth${maxWidth}` : `MaxWidth${maxWidth}NoMargin`)
        : '';
    const iconStyleClass = iconStyle === 'white-circle' ? 'SectionIconWhiteCircle' : '';

    return (
        <div className={maxWidthClass}>
            <div className={`SectionTagContainer ${alignmentClass}`}>
                <div className={iconStyleClass}>
                    <img src={icon} alt={tag} />
                </div>
                <div>
                    {tag}
                </div>
            </div>
            <div className={`SectionHeading ${alignmentClass}`}>
                {heading}
            </div>
        </div>
    );
};

export default SectionHeader;

