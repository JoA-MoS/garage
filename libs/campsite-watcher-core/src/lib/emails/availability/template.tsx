import { Html } from '@react-email/html';

export interface Campsite {
  site: string;
  id: string;
  loop: string;
  type: string;
  dates: string;
}

const trtdStyle = {
  border: '1px solid',
};

export function AvailabilityEmail(props: { campsites: Campsite[] }) {
  const { campsites } = props;

  return (
    <Html lang="en">
      <CampsiteList campsites={campsites} />
    </Html>
  );
}

function CampsiteList(props: { campsites: Campsite[] }) {
  const { campsites } = props;
  const CampsiteList = campsites.map((c) => (
    <CampsiteItem key={c.id} campsite={c} />
  ));
  const tableStyle = {
    width: '100%',
    'border-collapse': 'collapse',
    border: '1px solid',
  };

  return (
    <table style={tableStyle}>
      <tr style={trtdStyle}>
        <td style={trtdStyle}>site</td>
        <td style={trtdStyle}>loop</td>
        <td style={trtdStyle}>type</td>
        <td style={trtdStyle}>dates</td>
      </tr>
      <tbody>{CampsiteList}</tbody>
    </table>
  );
}

function CampsiteItem(props: { campsite: Campsite }) {
  const { site, id, loop, type, dates } = props.campsite;
  const siteUrl = `https://www.recreation.gov/camping/campsites/${id}`;
  return (
    <tr style={trtdStyle}>
      <td style={trtdStyle}>
        <a href={siteUrl}>{site}</a>
      </td>
      <td style={trtdStyle}>{loop}</td>
      <td style={trtdStyle}>{type}</td>
      <td style={trtdStyle}>{dates}</td>
    </tr>
  );
}
