import type { Metadata } from 'next'
import Image from 'next/image'
import Script from 'next/script'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllServiceAreaSlugs, getServiceAreaBySlug, serviceAreasData } from '@/lib/service-areas-data'
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'
import { Breadcrumb, Container } from '@/components/layout'
import Button from '@/components/ui/Button'
import { findBestLocationImage } from '@/lib/pixabay'
import { getBomWeatherSummary } from '@/lib/bom'
import { getOpenWeatherCurrent } from '@/lib/openweather'
import PostcodeBoundaryMap from '@/components/maps/PostcodeBoundaryMap'
// import { getAbsDemographicsForPostcode } from '@/lib/abs'

export async function generateStaticParams() {
  return getAllServiceAreaSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata(ctx: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await ctx.params
  const area = getServiceAreaBySlug(slug)
  if (!area) return { title: 'Service area not found' }
  const title = area.metaTitle
  const description = area.metaDescription
  const ogImage = `/og?title=${encodeURIComponent(area.locationName)}%20Service%20Area`
  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage], url: `/service-areas/${area.slug}` },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    alternates: {
      canonical: `/service-areas/${area.slug}`
    },
    keywords: `${area.locationName} garage doors, garage door installation ${area.locationName}, garage door repair ${area.locationName}, sectional doors ${area.locationName}, roller doors ${area.locationName}`
  }
}

export default async function ServiceAreaPage(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const area = getServiceAreaBySlug(slug)
  if (!area) notFound()

  // Map of location name to slug for reliable nearby links
  const nameToSlug = new Map(serviceAreasData.map(a => [a.locationName.toLowerCase(), a.slug]))

  // Custom full-content replacement for Werribee page (ignoring header/footer)
  if (slug === 'werribee') {
    return (
      <main className="bg-gray-50 font-sans">
        <Script id="fa-config" strategy="beforeInteractive">
          {`window.FontAwesomeConfig = { autoReplaceSvg: 'nest' };`}
        </Script>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" strategy="afterInteractive" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        {/* Breadcrumb */}
        <section id="breadcrumb" className="w-full px-20 py-4 bg-white">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#f58220] cursor-pointer">Home</span>
            <span className="text-[#333333]">/</span>
            <span className="text-[#f58220] cursor-pointer">Services</span>
            <span className="text-[#333333]">/</span>
            <span className="text-[#333333]">Local Service Areas</span>
          </div>
        </section>

        {/* Hero Section */}
        <section id="hero" className="w-full h-[600px] relative bg-gradient-to-r from-[#002e5b] to-[#2c3993] flex items-center justify-center">
          <img className="absolute inset-0 w-full h-full object-cover opacity-30" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4979cf93a9-4915ec641d2854285848.png" alt="Modern garage door installation on contemporary home in Geelong area" />
          <div className="relative z-10 text-center text-white max-w-4xl px-8">
            <h1 className="text-5xl font-montserrat font-bold mb-6 leading-tight">Premium Garage Door Services Across Geelong & Surrounding Areas</h1>
            <p className="text-xl mb-8 text-[#e1ecf8] max-w-2xl mx-auto">Expert installation, repair, and maintenance services for residential and commercial properties throughout the greater Geelong region</p>
            <div className="flex gap-4 justify-center">
              <button className="px-8 py-4 bg-[#f58220] text-white font-semibold rounded hover:bg-orange-600 transition-colors">Book Service Now</button>
              <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded hover:bg-white hover:text-[#002e5b] transition-colors">View Service Areas</button>
            </div>
          </div>
        </section>

        {/* Service Areas Overview */}
        <section id="service-areas" className="w-full py-16 px-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-montserrat font-bold text-[#002e5b] mb-4">Our Service Coverage</h2>
              <p className="text-lg text-[#333333] max-w-3xl mx-auto">Providing comprehensive garage door services across Geelong and the Surf Coast region with rapid response times and local expertise</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#f6f6f8] rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-map-marker-alt text-2xl text-[#002e5b]"></i>
                </div>
                <h3 className="text-xl font-montserrat font-semibold text-[#002e5b] mb-3">Greater Geelong</h3>
                <p className="text-[#333333] mb-4">Complete coverage of Geelong CBD, Newtown, East Geelong, West Geelong, and all surrounding suburbs</p>
                <span className="text-[#f58220] font-medium hover:underline cursor-pointer">View Geelong Areas →</span>
              </div>
              <div className="bg-[#f6f6f8] rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-water text-2xl text-[#002e5b]"></i>
                </div>
                <h3 className="text-xl font-montserrat font-semibold text-[#002e5b] mb-3">Surf Coast</h3>
                <p className="text-[#333333] mb-4">Specialized services for coastal properties in Torquay, Lorne, Apollo Bay and surrounding coastal areas</p>
                <span className="text-[#f58220] font-medium hover:underline cursor-pointer">View Coastal Areas →</span>
              </div>
              <div className="bg-[#f6f6f8] rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-mountain text-2xl text-[#002e5b]"></i>
                </div>
                <h3 className="text-xl font-montserrat font-semibold text-[#002e5b] mb-3">Hinterland</h3>
                <p className="text-[#333333] mb-4">Rural and semi-rural service coverage including Bannockburn, Inverleigh, and Colac regions</p>
                <span className="text-[#f58220] font-medium hover:underline cursor-pointer">View Rural Areas →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Geelong Areas Detail */}
        <section id="geelong-services" className="w-full py-16 px-20 bg-[#e1ecf8]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-montserrat font-bold text-[#002e5b] mb-6">Geelong Metro Services</h2>
                <p className="text-lg text-[#333333] mb-8">As Geelong's premier garage door specialists, we provide comprehensive services across all metropolitan areas with same-day emergency response and scheduled maintenance programs.</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-[#002e5b] mb-2">Central Geelong</h4>
                    <ul className="text-sm text-[#333333] space-y-1">
                      <li>• Geelong CBD</li>
                      <li>• East Geelong</li>
                      <li>• West Geelong</li>
                      <li>• South Geelong</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-[#002e5b] mb-2">Northern Suburbs</h4>
                    <ul className="text-sm text-[#333333] space-y-1">
                      <li>• Newtown</li>
                      <li>• Hamlyn Heights</li>
                      <li>• Herne Hill</li>
                      <li>• Manifold Heights</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-[#002e5b] mb-2">Eastern Areas</h4>
                    <ul className="text-sm text-[#333333] space-y-1">
                      <li>• Belmont</li>
                      <li>• Grovedale</li>
                      <li>• Waurn Ponds</li>
                      <li>• Mount Duneed</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-[#002e5b] mb-2">Western Corridor</h4>
                    <ul className="text-sm text-[#333333] space-y-1">
                      <li>• Lara</li>
                      <li>• Corio</li>
                      <li>• Norlane</li>
                      <li>• North Shore</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-[#f58220] text-white font-semibold rounded hover:bg-orange-600 transition-colors">Book Geelong Service</button>
                  <button className="px-6 py-3 border-2 border-[#002e5b] text-[#002e5b] font-semibold rounded hover:bg-[#002e5b] hover:text-white transition-colors">Get Quote</button>
                </div>
              </div>
              <div className="bg-white rounded-lg p-8">
                <h3 className="text-2xl font-montserrat font-semibold text-[#002e5b] mb-6">Geelong Service Highlights</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#f58220] rounded-full flex items-center justify-center flex-shrink-0 mt-1"><i className="fas fa-check text-white text-xs"></i></div>
                    <div>
                      <h4 className="font-semibold text-[#333333] mb-1">24/7 Emergency Response</h4>
                      <p className="text-sm text-[#333333]">Round-the-clock emergency repairs across all Geelong areas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#f58220] rounded-full flex items-center justify-center flex-shrink-0 mt-1"><i className="fas fa-check text-white text-xs"></i></div>
                    <div>
                      <h4 className="font-semibold text-[#333333] mb-1">Local Expertise</h4>
                      <p className="text-sm text-[#333333]">Deep understanding of Geelong's architectural styles and requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#f58220] rounded-full flex items-center justify-center flex-shrink-0 mt-1"><i className="fas fa-check text-white text-xs"></i></div>
                    <div>
                      <h4 className="font-semibold text-[#333333] mb-1">Commercial & Residential</h4>
                      <p className="text-sm text-[#333333]">Full-service solutions for homes, businesses, and industrial facilities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#f58220] rounded-full flex items-center justify-center flex-shrink-0 mt-1"><i className="fas fa-check text-white text-xs"></i></div>
                    <div>
                      <h4 className="font-semibold text-[#333333] mb-1">Preventive Maintenance</h4>
                      <p className="text-sm text-[#333333]">Scheduled maintenance programs to extend door lifespan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Surf Coast Services */}
        <section id="surf-coast-services" className="w-full py-16 px-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img className="w-full h-80 object-cover rounded-lg" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/da92611496-39a1a7838ebec7c80136.png" alt="Coastal garage door installation on beachside home in Torquay with salt-resistant materials" />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-4xl font-montserrat font-bold text-[#002e5b] mb-6">Surf Coast Specialists</h2>
                <p className="text-lg text-[#333333] mb-6">Coastal environments demand specialized solutions. Our surf coast services feature corrosion-resistant materials and designs built to withstand salt air and harsh weather conditions.</p>
                <div className="bg-[#f6f6f8] rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-[#002e5b] mb-4">Coastal Service Areas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <ul className="text-sm text-[#333333] space-y-2">
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Torquay</li>
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Anglesea</li>
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Aireys Inlet</li>
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Lorne</li>
                    </ul>
                    <ul className="text-sm text-[#333333] space-y-2">
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Apollo Bay</li>
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Winchelsea</li>
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Moriac</li>
                      <li className="flex items-center gap-2"><i className="fas fa-map-pin text-[#f58220] text-xs"></i>Deans Marsh</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3"><i className="fas fa-shield-alt text-[#f58220] text-lg"></i><span className="font-medium text-[#333333]">Marine-grade corrosion protection</span></div>
                  <div className="flex items-center gap-3"><i className="fas fa-wind text-[#f58220] text-lg"></i><span className="font-medium text-[#333333]">Wind-resistant design specifications</span></div>
                  <div className="flex items-center gap-3"><i className="fas fa-tools text-[#f58220] text-lg"></i><span className="font-medium text-[#333333]">Specialized coastal installation techniques</span></div>
                </div>
                <button className="px-6 py-3 bg-[#f58220] text-white font-semibold rounded hover:bg-orange-600 transition-colors">Book Coastal Service</button>
              </div>
            </div>
          </div>
        </section>

        {/* Service Types */}
        <section id="service-types" className="w-full py-16 px-20 bg-[#f6f6f8]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-montserrat font-bold text-[#002e5b] mb-4">Comprehensive Service Solutions</h2>
              <p className="text-lg text-[#333333] max-w-3xl mx-auto">From emergency repairs to planned installations, we deliver professional garage door services across all our coverage areas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4"><i className="fas fa-wrench text-2xl text-[#002e5b]"></i></div>
                <h3 className="text-lg font-montserrat font-semibold text-[#002e5b] mb-3">Emergency Repairs</h3>
                <p className="text-[#333333] text-sm mb-4">24/7 emergency repair services for broken springs, damaged panels, and malfunctioning openers</p>
                <span className="text-[#f58220] font-medium text-sm hover:underline cursor-pointer">Learn More →</span>
              </div>
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4"><i className="fas fa-hammer text-2xl text-[#002e5b]"></i></div>
                <h3 className="text-lg font-montserrat font-semibold text-[#002e5b] mb-3">New Installations</h3>
                <p className="text-[#333333] text-sm mb-4">Professional installation of residential and commercial garage doors with full warranty coverage</p>
                <span className="text-[#f58220] font-medium text-sm hover:underline cursor-pointer">Learn More →</span>
              </div>
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4"><i className="fas fa-cog text-2xl text-[#002e5b]"></i></div>
                <h3 className="text-lg font-montserrat font-semibold text-[#002e5b] mb-3">Maintenance Programs</h3>
                <p className="text-[#333333] text-sm mb-4">Scheduled maintenance services to prevent breakdowns and extend door lifespan</p>
                <span className="text-[#f58220] font-medium text-sm hover:underline cursor-pointer">Learn More →</span>
              </div>
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-[#e1ecf8] rounded-lg flex items-center justify-center mx-auto mb-4"><i className="fas fa-mobile-alt text-2xl text-[#002e5b]"></i></div>
                <h3 className="text-lg font-montserrat font-semibold text-[#002e5b] mb-3">Smart Automation</h3>
                <p className="text-[#333333] text-sm mb-4">Modern opener installations and smart home integration services</p>
                <span className="text-[#f58220] font-medium text-sm hover:underline cursor-pointer">Learn More →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Hinterland Services */}
        <section id="hinterland-services" className="w-full py-16 px-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-montserrat font-bold text-[#002e5b] mb-6">Rural & Hinterland Coverage</h2>
                <p className="text-lg text-[#333333] mb-6">Extending our premium services to rural properties and hinterland communities with specialized solutions for agricultural and semi-rural applications.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#f6f6f8] rounded-lg p-6">
                    <h4 className="font-semibold text-[#002e5b] mb-3">Western Hinterland</h4>
                    <ul className="text-sm text-[#333333] space-y-1"><li>• Bannockburn</li><li>• Inverleigh</li><li>• Shelford</li><li>• Teesdale</li></ul>
                  </div>
                  <div className="bg-[#f6f6f8] rounded-lg p-6">
                    <h4 className="font-semibold text-[#002e5b] mb-3">Southern Region</h4>
                    <ul className="text-sm text-[#333333] space-y-1"><li>• Colac</li><li>• Birregurra</li><li>• Forrest</li><li>• Beech Forest</li></ul>
                  </div>
                </div>
                <div className="bg-[#e1ecf8] rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-[#002e5b] mb-3">Rural Specialties</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3"><i className="fas fa-tractor text-[#f58220]"></i><span className="text-[#333333]">Agricultural building door solutions</span></div>
                    <div className="flex items-center gap-3"><i className="fas fa-warehouse text-[#f58220]"></i><span className="text-[#333333]">Large format and industrial doors</span></div>
                    <div className="flex items-center gap-3"><i className="fas fa-road text-[#f58220]"></i><span className="text-[#333333]">Extended travel service calls</span></div>
                  </div>
                </div>
                <button className="px-6 py-3 bg-[#f58220] text-white font-semibold rounded hover:bg-orange-600 transition-colors">Book Rural Service</button>
              </div>
              <div>
                <img className="w-full h-80 object-cover rounded-lg mb-6" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/8fb8a2a988-9211711eec12d4cda342.png" alt="Large agricultural garage door installation on rural property in Colac hinterland" />
                <div className="bg-[#f6f6f8] rounded-lg p-6">
                  <h4 className="font-semibold text-[#002e5b] mb-4">Why Choose Us for Rural Properties?</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3"><i className="fas fa-clock text-[#f58220] mt-1"></i><div><h5 className="font-medium text-[#333333]">Flexible Scheduling</h5><p className="text-sm text-[#333333]">We work around farming schedules and seasonal demands</p></div></div>
                    <div className="flex items-start gap-3"><i className="fas fa-truck text-[#f58220] mt-1"></i><div><h5 className="font-medium text-[#333333]">Mobile Service Units</h5><p className="text-sm text-[#333333]">Fully equipped vehicles for on-site repairs and installations</p></div></div>
                    <div className="flex items-start gap-3"><i className="fas fa-handshake text-[#f58220] mt-1"></i><div><h5 className="font-medium text-[#333333]">Local Understanding</h5><p className="text-sm text-[#333333]">Deep knowledge of rural requirements and challenges</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Testimonials */}
        <section id="testimonials" className="w-full py-16 px-20 bg-[#002e5b]">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-montserrat font-bold text-white mb-12">What Our Local Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-8">
                <div className="flex items-center justify-center mb-4"><div className="flex text-[#f58220]"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div></div>
                <p className="text-[#333333] mb-4 italic">"Outstanding service from start to finish. They understood our coastal requirements and delivered a solution that's been perfect for our Torquay property."</p>
                <div className="border-t pt-4"><h4 className="font-semibold text-[#002e5b]">Sarah Mitchell</h4><p className="text-sm text-[#333333]">Torquay Homeowner</p></div>
              </div>
              <div className="bg-white rounded-lg p-8">
                <div className="flex items-center justify-center mb-4"><div className="flex text-[#f58220]"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div></div>
                <p className="text-[#333333] mb-4 italic">"Excellent emergency response when our commercial door failed. Had us back in business within hours. Highly recommend for Geelong businesses."</p>
                <div className="border-t pt-4"><h4 className="font-semibold text-[#002e5b]">David Chen</h4><p className="text-sm text-[#333333]">Geelong Business Owner</p></div>
              </div>
              <div className="bg-white rounded-lg p-8">
                <div className="flex items-center justify-center mb-4"><div className="flex text-[#f58220]"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div></div>
                <p className="text-[#333333] mb-4 italic">"Professional installation of our farm shed doors. They made the trip out to Colac and delivered exactly what we needed for our rural operation."</p>
                <div className="border-t pt-4"><h4 className="font-semibold text-[#002e5b]">Mark Thompson</h4><p className="text-sm text-[#333333]">Colac Rural Property</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Booking CTA */}
        <section id="booking-cta" className="w-full py-16 px-20 bg-[#f58220]">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-montserrat font-bold mb-6">Ready to Book Your Service?</h2>
            <p className="text-xl mb-8">Get professional garage door services across Geelong and surrounding areas. Same-day emergency response available.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+61352219222" className="px-8 py-4 bg-white text-[#f58220] font-semibold rounded hover:bg-gray-100 transition-colors"><i className="fas fa-phone mr-2"></i>Call (03) 5221 9222</a>
              <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded hover:bg-white hover:text-[#f58220] transition-colors">Book Online Service</button>
            </div>
          </div>
        </section>

        
      </main>
    )
  }

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Service Areas', href: '/service-areas' },
    { label: area.locationName, active: true },
  ]

  // Try to source a high-quality Pixabay photo for the hero (24h cache)
  const pixabayHit = await findBestLocationImage(area.locationName)
  const heroSrc = pixabayHit?.largeImageURL || pixabayHit?.webformatURL || area.heroImage.src
  const heroAlt = pixabayHit ? `${area.locationName} architecture — ${pixabayHit.tags}` : area.heroImage.alt

  // Local snapshot data (best-effort; all optional). Cache observed at source.
  const [ow, bom] = await Promise.all([
    area.latLng ? getOpenWeatherCurrent(area.latLng.lat, area.latLng.lng) : Promise.resolve(undefined),
    getBomWeatherSummary('VIC'),
  ])
  const weather = ow || bom

  return (
    <main className="bg-gray-50">
      <Breadcrumb items={crumbs} />

      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-r from-[#002e5b] to-[#2c3993] flex items-center justify-center">
        <Image
          src={heroSrc}
          alt={heroAlt}
          fill
          className="object-cover opacity-30"
        />
        <div className="relative z-10 text-center text-white max-w-4xl px-8">
          <h1 className="text-5xl font-montserrat font-bold mb-6 leading-tight">
            Premium Garage Door Services in {area.locationName}
          </h1>
          <p className="text-xl mb-8 text-[#e1ecf8] max-w-2xl mx-auto">
            {area.introductionContent}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg">Book Service Now</Button>
            <a
              href="tel:+61352219222"
              className="inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-deep-blue hover:bg-deep-blue-hover text-white px-8 py-4 text-lg rounded-lg"
            >
              Call (03) 5221 9222
            </a>
          </div>
        </div>
        {pixabayHit && (
          <div className="absolute bottom-2 right-3 text-white/80 text-xs bg-black/30 px-2 py-1 rounded">
            Photo: <a className="underline hover:text-white" href={pixabayHit.pageURL} target="_blank" rel="noopener noreferrer">{pixabayHit.user} via Pixabay</a>
          </div>
        )}
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-4">
              Why Choose Us in {area.locationName}?
            </h2>
            <p className="text-lg text-charcoal max-w-3xl mx-auto">
              Local expertise meets premium quality garage door solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {area.keyFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-powder-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-deep-blue text-2xl">✓</span>
                </div>
                <p className="font-semibold text-charcoal">{feature}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Services Offered Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-4">
              Our Services in {area.locationName}
            </h2>
            <p className="text-lg text-charcoal max-w-3xl mx-auto">
              Comprehensive garage door solutions tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {area.servicesOffered.map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-powder-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-deep-blue">{service.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-deep-blue mb-3">{service.title}</h3>
                <p className="text-charcoal text-sm mb-4">{service.description}</p>
                <span className="text-vibrant-orange font-medium text-sm hover:underline cursor-pointer">Learn More →</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Service Area Map + Local Weather */}
      <section className="py-16 bg-white">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-4">Service Area Map for {area.postcode}</h2>
              <div className="rounded-lg border border-deep-blue-light p-6 bg-white mt-4">
                <h3 className="text-xl font-semibold text-deep-blue mb-2">Current Weather</h3>
                {weather ? (
                  <div className="text-charcoal">
                    <p className="mb-1">Temp: <span className="font-medium">{weather.temp ?? '—'}°C</span> • Feels like: <span className="font-medium">{weather.feelsLike ?? '—'}°C</span></p>
                    <p className="mb-1">Humidity: <span className="font-medium">{weather.humidity ?? '—'}%</span> • Wind: <span className="font-medium">{weather.windKmh ?? '—'} km/h</span></p>
                    {weather.observedAt && (<p className="text-sm text-charcoal/70">Updated: {weather.observedAt}</p>)}
                  </div>
                ) : (
                  <p className="text-charcoal">Weather data is currently unavailable.</p>
                )}
              </div>
            </div>
            <div>
              <PostcodeBoundaryMap postcode={area.postcode} height={360} />
              <p className="text-sm text-charcoal/70 mt-2">Map data © OpenStreetMap contributors • Boundary © ABS ASGS 2021</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Local Insights removed per request */}

      {/* Local Service Details Section */}
      <section className="py-16 bg-powder-blue">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-6">
                {area.locationName} Service Highlights
              </h2>
              <p className="text-lg text-charcoal mb-8">
                {area.localInfo.content}
              </p>

              <div className="space-y-4 mb-8">
                {area.whyChooseUs.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-vibrant-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <span className="font-medium text-charcoal">{reason}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="primary" size="md">
                  Book {area.locationName} Service
                </Button>
                <Button variant="secondary" size="md">
                  Get Quote
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-deep-blue mb-6">
                {area.locationName} Service Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-charcoal">Location:</span>
                  <span className="font-semibold text-deep-blue">{area.locationName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-charcoal">Region:</span>
                  <span className="font-semibold text-deep-blue">{area.region}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-charcoal">Postcode:</span>
                  <span className="font-semibold text-deep-blue">{area.postcode}</span>
                </div>
                {area.population && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-charcoal">Population:</span>
                    <span className="font-semibold text-deep-blue">{area.population}</span>
                  </div>
                )}

                <div className="pt-4">
                  <h4 className="font-semibold text-deep-blue mb-3">Nearby Areas We Serve</h4>
                  <div className="flex flex-wrap gap-2">
                    {area.nearbyAreas.map((nearbyArea, index) => {
                      const fallbackSlug = nearbyArea
                        .toLowerCase()
                        .trim()
                        .replace(/&/g, 'and')
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                      const matchedSlug = nameToSlug.get(nearbyArea.toLowerCase()) || fallbackSlug
                      return (
                        <Link
                          key={index}
                          href={`/service-areas/${matchedSlug}`}
                          className="text-sm bg-gray-100 px-3 py-1 rounded-full text-charcoal hover:bg-vibrant-orange hover:text-white transition-colors"
                        >
                          {nearbyArea}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Customer Testimonial Section */}
      {area.testimonial && (
        <section className="py-16 bg-white">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-4">
                What Our {area.locationName} Customers Say
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex text-vibrant-orange">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-xl">★</span>
                    ))}
                  </div>
                </div>
                <blockquote className="text-xl italic text-charcoal mb-6 text-center">
                  "{area.testimonial.quote}"
                </blockquote>
                <div className="text-center border-t pt-4">
                  <h4 className="font-semibold text-deep-blue text-lg">
                    {area.testimonial.author}
                  </h4>
                  <p className="text-charcoal">
                    {area.testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-4">
              Frequently Asked Questions - {area.locationName}
            </h2>
            <p className="text-lg text-charcoal max-w-3xl mx-auto">
              Common questions about garage door services in {area.locationName}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-3 text-deep-blue">
                How quickly can you install a garage door in {area.locationName}?
              </h3>
              <p className="text-charcoal">
                New doors are typically installed within 5–6 weeks from order. Emergency repairs in {area.locationName} are completed within 24 hours, and standard service bookings are usually scheduled within 1 week.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-3 text-deep-blue">
                Do you service all garage door brands in {area.locationName}?
              </h3>
              <p className="text-charcoal">
                Yes, we service and repair all major garage door brands including B&D, Steel-Line, Gliderol, Danmar, Centurion, and ATA. Our technicians are trained on all systems.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-3 text-deep-blue">
                What warranty do you provide for {area.locationName} installations?
              </h3>
              <p className="text-charcoal">
                All our installations in {area.locationName} come with comprehensive manufacturer warranties plus our own workmanship guarantee. Specific terms vary by product.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Service Booking CTA */}
      <section className="py-16 bg-vibrant-orange">
        <Container>
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Book Your {area.locationName} Service?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Get professional garage door services in {area.locationName} and surrounding areas.
              Same-day emergency response available.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="tel:+61352219222"
                className="inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-vibrant-orange hover:bg-gray-100 px-8 py-4 text-lg rounded-lg"
              >
                <span className="mr-2">📞</span>
                Call (03) 5221 9222
              </a>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-vibrant-orange"
              >
                Book Online Service
              </Button>
            </div>

            <div className="text-center">
              <p className="text-white/90">
                Serving {area.locationName} and surrounding areas: {area.nearbyAreas.join(', ')}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Schema Markup */}
      <LocalBusinessSchema
        locationName={area.locationName}
        description={area.introductionContent}
        address={`${area.locationName}, ${area.region}, VIC ${area.postcode}`}
        telephone="(03) 5221 9222"
        url={`https://geelonggaragedoors.com.au/service-areas/${area.slug}`}
      />
      <BreadcrumbSchema items={crumbs.map(c => ({
        name: c.label,
        url: c.href ? `https://geelonggaragedoors.com.au${c.href}` : undefined
      }))} />
    </main>
  )
}
