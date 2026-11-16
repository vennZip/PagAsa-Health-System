import { getPasswordRequirements } from "../utils/passwordPolicy";

export default function PasswordRequirements({ password, id }) {
  return <ul id={id} className="password-requirements" aria-label="Password requirements">
    {getPasswordRequirements(password).map(({ id: key, label, met }) => <li key={key} data-met={met}>
      <span aria-hidden="true">{met ? "✓" : "○"}</span> {label}<span className="password-requirement-status">{met ? " (met)" : " (not met)"}</span>
    </li>)}
  </ul>;
}
