export default function Tags({ labels }: { labels: string[] }) {
  return <div className="tags">{labels.map(label => <span className="tag" key={label}>{label}</span>)}</div>;
}
