interface Props {
  shift: string;
  fullName: string;
}

export default function HomeButtonShiftDoctor({ shift, fullName }: Props) {
  return (
    <button className="btn btn-outline rounded-full">
      {shift.toString()} {/* 07-13h */} <span className="font-bold">{fullName}</span>
    </button>
  );
}
