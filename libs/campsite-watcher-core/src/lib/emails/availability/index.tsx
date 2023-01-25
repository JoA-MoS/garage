import { render } from '@react-email/render';
import { Campsite, AvailabilityEmail } from './template';

export function renderAvailabilityEmail(campsites: Campsite[]) {
  return render(<AvailabilityEmail campsites={campsites} />);
}
