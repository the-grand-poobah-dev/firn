-- Deterministic demo detail content. This is illustrative, not diligence material.
update properties p set
valuation_history=(select jsonb_agg(jsonb_build_object('d',to_char(date_trunc('month',current_date)::date-((8-g.i)||' months')::interval,'YYYY-MM'),'v',round((p.valuation/1000000.0)*(.84+g.i*.02),3)) order by g.i) from generate_series(0,8) g(i)),
rent_history=(select jsonb_agg(jsonb_build_object('d',to_char(date_trunc('month',current_date)::date-((5-g.i)||' months')::interval,'YYYY-MM'),'v',round((p.valuation/1000000.0)*.004*(.94+g.i*.012),4)) order by g.i) from generate_series(0,5) g(i)),
documents=jsonb_build_array(
jsonb_build_object('title','Title deed summary','type','pdf','size','1.2 MB'),
jsonb_build_object('title','Independent valuation','type','pdf','size','2.4 MB'),
jsonb_build_object('title','Lease summary','type','pdf','size','860 KB'),
jsonb_build_object('title','SPV structure','type','pdf','size','1.1 MB'),
jsonb_build_object('title','Insurance certificate','type','pdf','size','740 KB'),
jsonb_build_object('title','Quarterly report','type','pdf','size','1.6 MB')
);
insert into property_updates(property_id,title,body,posted_on)
select p.id,t.title,t.body,(current_date-((4-g.n)||' months')::interval)::date
from properties p cross join generate_series(1,5) g(n)
join lateral (select x.title,x.body from (values
(1,'Quarterly operating update','Illustrative operating summary; not a verified property disclosure.'),
(2,'Occupancy snapshot','Illustrative occupancy status; confirm with operator records.'),
(3,'Maintenance and reserves','Sample maintenance note; not a real asset report.'),
(4,'Rental market review','Sample market commentary; not an independently researched valuation.'),
(5,'Investor report published','Sample reporting entry; supporting documents are illustrative.')
) x(n,title,body) where x.n=g.n) t on true;
