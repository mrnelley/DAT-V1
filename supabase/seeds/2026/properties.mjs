// User-provided partial portfolio. Missing unit counts and population stay null.
export const properties = [
 ['1528 West Apts','1528','1528 W Hamilton St','Allentown','PA','18102','Senior 55+ Elderly & Handicapped'],
 ['Beach Run','BEACH','325 N. Center St.','Fredericksburg','PA','17026','General'],
 ['Brandywine Ctr','BHH','744 E. Lincoln Hwy','Coatesville','PA','19320','Senior 62+'],
 ['Claymont Street Apartments','CLAY','1300 E. 16th St.','Wilmington','DE','19805','General / Section 8'],
 ['College Avenue Apartments','COL','213 College Ave','Lancaster','PA','17603',null],
 ['Duke Manor Apts.','DMA','716 Rockland St.','Lancaster','PA','17602','Family HUD/Section 8'],
 ['Exeter Apartments (Bond 5 LP)','XTR','222 Schooley Ave.','Exeter','PA','18643','Senior Tax Credit'],
 ['The Flats Phase I','FLATS','525 N Union St','Wilmington','DE','19805','General / Section 8'],
 ['The Flats Phase II','FLATS2','601 N Union St','Wilmington','DE','19805','General / Section 8'],
 ['The Flats Phase III','FLATS3','610 Bayard Ave','Wilmington','DE','19805','General / Section 8'],
 ['The Flats Phase IV','FLATS4','610 Ferris St','Wilmington','DE','19805','General / Section 8'],
 ['Glenbrook Apartments','GLEN','463 Main St','Atglen','PA','19310','General'],
 ['Governors Gate Apartments','GOVGATE','405 Governors Park Drive','Bellefonte','PA','16823','Family Section 8'],
 ['Hamburg School Apartments','HAMBURG','690 E State Street','Hamburg','PA','19526','General / Section 8'],
 ['Henner Apts.','HAA','24 E. High St.','Wolmelsdorf','PA','19567','Senior 55+ / Elderly & Handicapped'],
 ['Heritage Point Apartments','HPA','94 McGarraher Street','Wilkes-Barre','PA','18702','General / Section 8'],
].map(([name,code,street,city,state,postalCode,population])=>({name,code,street,city,state,postalCode,population,units:null}));
