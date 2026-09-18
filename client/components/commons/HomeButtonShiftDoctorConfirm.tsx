import i18n from '#locales/i18n.client';

interface Props {
  shift: string;
  fullName: string;
  phoneNumber?: string;
}

export default function HomeButtonShiftDoctorConfirm({ shift, fullName, phoneNumber }: Props) {
  const whatsappNumber = phoneNumber?.replace(/\D/g, '');

  return (
    <div className="join join-horizontal">
      <button className="btn join-item rounded-s-full pointer-events-none">
        🌘 {shift.toString()} {/* ex: 19h - 00h */} {fullName}{' '}
      </button>
      {whatsappNumber ? (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          className="btn join-item btn-success rounded-e-full"
        >
          <i className="fa-brands fa-whatsapp"></i> {i18n.t('homeConfirm')}
        </a>
      ) : (
        <button type="button" className="btn join-item btn-success rounded-e-full" disabled>
          <i className="fa-brands fa-whatsapp"></i> {i18n.t('homeConfirm')}
        </button>
      )}
    </div>
  );
}
