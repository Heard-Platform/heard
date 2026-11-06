import { HEARD_HOME_URL } from "../../../utils/constants/links";

export function Footer() {
  return (
    <footer className="normal-bg border-t">
      <p className="mx-auto max-w-5xl px-6 py-6 text-center text-sm secondary-text">
        Made with{" "}
        <a
          href={HEARD_HOME_URL}
          className="font-semibold underline underline-offset-4"
        >
          heard.vote
        </a>
      </p>
    </footer>
  );
}